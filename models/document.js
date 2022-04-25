'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class document extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {

      document.belongsToMany(models.User, {
        through: models.user_document
      })
    }
  };
  document.init({
    docName: DataTypes.STRING,
    sender: DataTypes.STRING,
    sendingCompany: DataTypes.STRING,
    docPath: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'document',
  });
  return document;
};