import BusinessPartner from '../models/hr-models/BusinessPartner.js';

// @desc    Get all business partners with search and filtering
// @route   GET /api/business-partners
// @access  Private
export const getBusinessPartners = async (req, res) => {
  try {
    const { search, department, status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const partners = await BusinessPartner.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BusinessPartner.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: partners.length,
      total,
      data: partners,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve business partners',
      error: error.message,
    });
  }
};

// @desc    Get single business partner by ID
// @route   GET /api/business-partners/:id
// @access  Private
export const getBusinessPartnerById = async (req, res) => {
  try {
    const partner = await BusinessPartner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Business partner not found' });
    }
    return res.status(200).json({ success: true, data: partner });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving partner details', error: error.message });
  }
};

// @desc    Create new business partner
// @route   POST /api/business-partners
// @access  Private (Admin / HR)
export const createBusinessPartner = async (req, res) => {
  try {
    const { name, email, phone, department, assignedTeams, status, notes } = req.body;

    // Check duplicate email
    const existing = await BusinessPartner.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A business partner with this email already exists' });
    }

    const partner = await BusinessPartner.create({
      name,
      email,
      phone,
      department,
      assignedTeams: Array.isArray(assignedTeams) ? assignedTeams : [],
      status: status || 'Active',
      notes: notes || '',
      createdBy: req.user ? req.user._id : undefined,
    });

    return res.status(201).json({
      success: true,
      message: 'Business partner created successfully',
      data: partner,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create business partner',
    });
  }
};

// @desc    Update business partner
// @route   PUT /api/business-partners/:id
// @access  Private (Admin / HR)
export const updateBusinessPartner = async (req, res) => {
  try {
    const partner = await BusinessPartner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Business partner not found' });
    }

    // Email conflict check
    if (req.body.email && req.body.email.toLowerCase() !== partner.email) {
      const existing = await BusinessPartner.findOne({ email: req.body.email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email is already taken by another partner' });
      }
    }

    const updatedPartner = await BusinessPartner.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Business partner updated successfully',
      data: updatedPartner,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update business partner',
    });
  }
};

// @desc    Delete business partner
// @route   DELETE /api/business-partners/:id
// @access  Private (Admin / HR)
export const deleteBusinessPartner = async (req, res) => {
  try {
    const partner = await BusinessPartner.findByIdAndDelete(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Business partner not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Business partner deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete business partner',
      error: error.message,
    });
  }
};