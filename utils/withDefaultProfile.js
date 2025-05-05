// utils/withDefaultProfile.js
module.exports = function withDefaultProfile(user) {
    if (!user) return null;
    user.profileImage = user.profileImage || 'default.jpg';
    return user;
};
  