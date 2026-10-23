import RequestActivityLog from '../models/hr-models/RequestActivityLog.js';

export const logActivity = async ({
  req, action, topic, description, resourceType, resourceId, subjectUserId, hrOnly = false,
}) => {
  try {
    await RequestActivityLog.create({
      userId: req.user._id,   
      subjectUserId,
      action,
      topic,
      description,
      resourceType,
      resourceId,
      hrOnly,
      ip: req.ip,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};