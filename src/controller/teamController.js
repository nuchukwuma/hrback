import Team from '../models/people/Team.js';

export const getTeams = async (req, res) => {
  const filter = req.user.role === 'hr' ? {} : { _id: req.user.teamId };
  const teams = await Team.find(filter).select('name').sort({ name: 1 });
  res.json({ teams });
};
