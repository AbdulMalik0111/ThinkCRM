import * as userService from '../services/user.service.js';

export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.getAllUsers(req.query);
    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await userService.resetPassword(req.params.id, req.body?.password || req.body?.tempPassword);
    res.status(200).json({
      success: true,
      message: 'Staff password reset successfully',
      data: {
        tempPassword: result.tempPassword,
        user: {
          _id: result.user._id,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
          role: result.user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStaffActivity = async (req, res, next) => {
  try {
    const activity = await userService.getStaffActivity(req.params.id, req.query);
    res.status(200).json({
      success: true,
      message: 'Staff activity fetched successfully',
      data: { activity },
    });
  } catch (error) {
    next(error);
  }
};
