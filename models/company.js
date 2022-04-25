'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Company extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Company.belongsToMany(models.User, {
        through: models.user_company
        
      })
    }
  };
  Company.init({
    name:{
     type:DataTypes.STRING,
     unique:true
  }
    }, {
    sequelize,
    modelName: 'Company',
    timestamps:false
  });
  return Company;
};