'use strict';
module.exports = (sequelize, DataTypes) => {
  var account = sequelize.define('account', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    timeZone: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    regEmail: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    ref: {
      type: DataTypes.STRING(1024),
      allowNull: false
    },
    __temp_partnerStatus: {
      type: DataTypes.INTEGER
    },
    registerAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    lang: {
      type: DataTypes.STRING(2),
      allowNull: false
    }
  }, {
    timestamps: false
  });

  account.associate = function(models) {
    account.belongsTo(models.promoCode, {
      foreignKey: 'promo'
    });

    account.hasOne(models.promoCode, {
      foreignKey: 'accountId',
      constraints: false
    });
  };

  return account;
};