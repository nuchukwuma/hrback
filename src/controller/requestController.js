import Request from '../models/hr-models/Request.js';
import RequestActivityLog from '../models/hr-models/RequestActivityLog.js';
import Notification from '../models/support/Notification.js';
import User from '../models/people/User.js';
import { logActivity } from '../utils/LogActivity.js';

const sameId = (a, b) => Boolean(a && b) && String(a) === String(b);

const TRANSITIONS = {
  submitted: ['in-review', 'rejected'],
  'in-review': ['approved', 'rejected'],
  approved: ['resolved'],
  rejected: [],
  resolved: [],
};

const canHandle = (user, request) => {
  if (user.role === 'hr') return true;
  return user.role === 'manager' &&
    !request.routeToHR &&
    sameId(request.assignedTo, user._id);
};

const requestFields = 'type topic date essay aboutManager routeToHR status history submittedBy assignedTo createdAt updatedAt';

// Create a request and send a notification to the manager or HR.
export const createRequest = async (req, res) => {
  const { type, topic, date, essay, aboutManager = false } = req.body;

  if (!type || !topic?.trim() || !date || !essay?.trim()) {
    return res.status(400).json({
      message: 'Request type, topic, date and details are required',
    });
  }

  if (!['leave', 'equipment', 'document', 'complaint', 'incident', 'other'].includes(type)) {
    return res.status(400).json({ message: 'Choose a valid request type' });
  }

  const requestDate = new Date(date);
  if (Number.isNaN(requestDate.getTime())) {
    return res.status(400).json({ message: 'Choose a valid date' });
  }

  // Requests about a manager and complaints/incidents go straight to HR.
  const routeToHR = Boolean(aboutManager) || ['complaint', 'incident'].includes(type) || req.user.role === 'hr';
  let assignedTo = null;
  let recipients = [];

  if (routeToHR) {
    const hrUsers = await User.find({ role: 'hr', status: 'active' }).select('_id');
    if (hrUsers.length === 0) {
      return res.status(503).json({ message: 'There are no active HR users to receive this request' });
    }
    recipients = hrUsers;
  } else {
    if (!req.user.managerId) {
      return res.status(400).json({ message: 'No manager is assigned to your account. Please contact HR.' });
    }

    const manager = await User.findOne({
      _id: req.user.managerId,
      role: 'manager',
      status: 'active',
    }).select('_id');

    if (!manager) {
      return res.status(400).json({ message: 'Your assigned manager is not active. Please contact HR.' });
    }

    assignedTo = manager._id;
    recipients = [manager];
  }

  const request = await Request.create({
    type,
    topic: topic.trim(),
    date: requestDate,
    essay: essay.trim(),
    aboutManager: Boolean(aboutManager),
    submittedBy: req.user._id,
    assignedTo,
    routeToHR,
    status: 'submitted',
    history: [{ status: 'submitted', by: req.user._id, note: 'Request submitted' }],
  });

  await logActivity({
    req,
    action: 'request.created',
    topic: request.type,
    description: `Submitted request: ${request.topic}`,
    resourceType: 'Request',
    resourceId: request._id,
    subjectUserId: req.user._id,
    hrOnly: routeToHR,
  });

  await Notification.insertMany(
    recipients.map((recipient) => ({
      userId: recipient._id,
      type: 'request-submitted',
      message: `New ${type} request from ${req.user.email}: ${request.topic}`,
      link: '/requests',
      relatedRequestId: request._id,
    }))
  );

  const savedRequest = await Request.findById(request._id)
    .select(requestFields)
    .populate('submittedBy', 'email role')
    .populate('assignedTo', 'email role');

  res.status(201).json({ request: savedRequest, message: 'Request sent successfully' });
};


export const getMyRequests = async (req, res) => {
  const requests = await Request.find({ submittedBy: req.user._id })
    .select(requestFields)
    .populate('submittedBy', 'email role')
    .populate('assignedTo', 'email role')
    .sort({ createdAt: -1 });

  res.json({ requests });
};

export const getRequestInbox = async (req, res) => {
  let filter;

  if (req.user.role === 'manager') {
    filter = { assignedTo: req.user._id, routeToHR: false };
  } else if (req.user.role === 'hr') {
    filter = { routeToHR: true };
  } else {
    return res.status(403).json({ message: 'Only managers and HR can open the request inbox' });
  }

  const requests = await Request.find(filter)
    .select(requestFields)
    .populate('submittedBy', 'email role')
    .populate('assignedTo', 'email role')
    .sort({ createdAt: -1 });

  res.json({ requests });
};

export const updateRequestStatus = async (req, res) => {
  const { status: newStatus, note = '' } = req.body;

  if (!Object.prototype.hasOwnProperty.call(TRANSITIONS, newStatus)) {
    return res.status(400).json({ message: 'Choose a valid request status' });
  }

  const request = await Request.findById(req.params.id);
  if (!request || !canHandle(req.user, request)) {
    return res.status(404).json({ message: 'Request not found' });
  }

  if (sameId(request.submittedBy, req.user._id)) {
    return res.status(403).json({ message: 'You cannot review your own request' });
  }


  const currentStatus = request.status === 'inreview'
    ? 'in-review'
    : request.status || 'submitted';

  if (!TRANSITIONS[currentStatus]?.includes(newStatus)) {
    return res.status(400).json({
      message: `Cannot change a request from ${currentStatus} to ${newStatus}`,
    });
  }

  if (newStatus === 'rejected' && !note.trim()) {
    return res.status(400).json({ message: 'Please provide a reason for rejecting the request' });
  }

  request.status = newStatus;
  request.history.push({ status: newStatus, by: req.user._id, note: note.trim() });
  await request.save();

  await logActivity({
    req,
    action: `request.${newStatus}`,
    topic: request.type,
    description: `${req.user.email} changed "${request.topic}" to ${newStatus}${note.trim() ? `: ${note.trim()}` : ''}`,
    resourceType: 'Request',
    resourceId: request._id,
    subjectUserId: request.submittedBy,
    hrOnly: request.routeToHR,
  });

  await Notification.create({
    userId: request.submittedBy,
    type: 'request-status-changed',
    message: `Your request "${request.topic}" is now ${newStatus}${note.trim() ? `. Note: ${note.trim()}` : ''}`,
    link: '/requests',
    relatedRequestId: request._id,
  });

  const updatedRequest = await Request.findById(request._id)
    .select(requestFields)
    .populate('submittedBy', 'email role')
    .populate('assignedTo', 'email role');

  res.json({ request: updatedRequest, message: 'Request status updated' });
};


export const getRequestActivity = async (req, res) => {
  let filter = {};

  if (req.user.role !== 'hr') {
    let visibleRequests;

    if (req.user.role === 'manager') {
      visibleRequests = await Request.find({
        $or: [
          { assignedTo: req.user._id, routeToHR: false },
          { submittedBy: req.user._id },
        ],
      }).select('_id');
    } else {
      visibleRequests = await Request.find({ submittedBy: req.user._id }).select('_id');
    }

    const requestIds = visibleRequests.map((request) => request._id);
    if (requestIds.length === 0) return res.json({ activities: [] });
    filter = { resourceType: 'Request', resourceId: { $in: requestIds } };
  }

  const activities = await RequestActivityLog.find(filter)
    .populate('userId', 'email role')
    .populate('subjectUserId', 'email role')
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({ activities });
};
