'use strict';
module.exports = (sequelize, DataTypes) => {
  let Users = sequelize.define('Users', {
    userid: {type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, autoIncrement: true},
    email: {type: DataTypes.STRING, allowNull: false},
    password: {type: DataTypes.STRING, allowNull: false},
    name: {type: DataTypes.STRING, allowNull: false},
    gh_handle: {type: DataTypes.STRING, allowNull: false},
    gh_avatar_url: {type: DataTypes.STRING, allowNull: false},
    gh_location: {type: DataTypes.STRING, allowNull: false},
    gh_blog: {type: DataTypes.STRING, allowNull: false},
    gh_public_repos: {type: DataTypes.INTEGER.UNSIGNED, allowNull: false},
    bio: {type: DataTypes.TEXT},
    linkedin: {type: DataTypes.STRING},
    twitter: {type: DataTypes.STRING},
    facebook: {type: DataTypes.STRING},
    stack_overflow: {type: DataTypes.STRING},
    dribbble: {type: DataTypes.STRING},
    behance: {type: DataTypes.STRING},
    latitude: {type: DataTypes.STRING},
    longitude: {type: DataTypes.STRING},
  });

  return Users;
};
