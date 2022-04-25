'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user_document extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  user_document.init({
    accepted: {
      type: DataTypes.BOOLEAN                     ,
      defaultValue: false,
    },
    rejected: {
      type: DataTypes.BOOLEAN                     ,
      defaultValue: false
    },
    pending: {
      type: DataTypes.BOOLEAN                     ,
      defaultValue: true
    }
  }, {
    timestamps: false,
    sequelize,
    modelName: 'user_document',
  });
  return user_document;
};