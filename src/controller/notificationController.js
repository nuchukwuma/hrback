import Notification from '../models/support/Notification.js';

export const getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .populate('relatedRequestId', 'topic status type')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ notifications });
};

export const markNotificationRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { readAt: new Date() } },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  res.json({ notification });
};
