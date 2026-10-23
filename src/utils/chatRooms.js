

export const roomOf = (channelId) => `channel:${channelId}`;


export const joinChannelRooms = (io, channel) => {
  if (!io) return;
  const room = roomOf(channel._id);

  if (channel.type === 'company') io.socketsJoin(room); // everybody connected

  if (channel.type === 'team') {
    io.in(`team:${channel.team}`).socketsJoin(room); // members of that team
    io.in('hr').socketsJoin(room);                   // and HR
  }

  if (channel.type === 'group') {
    channel.members.forEach((id) => io.in(`user:${id}`).socketsJoin(room));
  }
};
