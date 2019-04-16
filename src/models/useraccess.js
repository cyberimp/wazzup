'use strict';
module.exports = (sequelize, DataTypes) => {
  var userAccess = sequelize.define('userAccess', {
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      primaryKey: true,
      allowNull: false,
      type: DataTypes.UUID
    },
    role: {
      type: DataTypes.STRING(30),
      allowNull: false
    }
  }, {
    timestamps: false,
    tableName: 'userAccess'
  });

  userAccess.associate = function(models) {
    userAccess.belongsTo(models.account, {
      foreignKey: 'accountId'
    });

    userAccess.belongsTo(models.user, {
      foreignKey: 'userId'
    });
  };

  return userAccess;
};