
import User from '../models/people/User.js';


export const scopeFilter = async (user, field = 'userId') => {
  if (user.role === 'hr') return {};

  if (user.role === 'manager') {
    const team = await User.find({ managerId: user._id }).select('_id');
    const ids = team.map((u) => u._id);
    return { [field]: { $in: [...ids, user._id] } }; 
  }

  return { [field]: user._id }; 
};