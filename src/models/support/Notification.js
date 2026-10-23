import mongoose from 'mongoose';


const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, 
    type: { type: String, default: 'info' },     
    message: { type: String, required: true },  
    link: { type: String, default: '' },        
    relatedRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', default: null },
    readAt: { type: Date, default: null },       
  },
  { timestamps: true } 
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;