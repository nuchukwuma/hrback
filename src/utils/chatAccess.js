
const sameId = (a, b) => Boolean(a && b) && String(a) === String(b);

export const canAccessChannel = (user, channel) => {
  if (channel.type === 'company') return true;                 
  if (channel.type === 'team') {
    return user.role === 'hr' || sameId(user.teamId, channel.team);
  }
  return channel.members.some((id) => sameId(id, user._id));   
};

export const channelFilterFor = (user) => {
  const options = [{ type: 'company' }, { type: 'group', members: user._id }];

  if (user.role === 'hr') options.push({ type: 'team' });
  else if (user.teamId) options.push({ type: 'team', team: user.teamId });

  return { $or: options };
};
