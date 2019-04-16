'use strict';
module.exports = (sequelize, DataTypes) => {
  var emailToken = sequelize.define('emailToken', {
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    userId: {
      allowNull: false,
      type: DataTypes.UUID
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    validity: {
      type: DataTypes.DATE
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: false
  });

  emailToken.associate = function(models) {
    emailToken.belongsTo(models.account, {
      foreignKey: 'accountId'
    });

    emailToken.belongsTo(models.user, {
      foreignKey: 'userId'
    });
  };

  return emailToken;
};