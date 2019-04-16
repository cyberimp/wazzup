'use strict';
module.exports = (sequelize, DataTypes) => {
  var promoCode = sequelize.define('promoCode', {
    code: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING(50)
    },
    type: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    validity: {
      type: DataTypes.DATE
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    timestamps: false,
    indexes: [
      {
        fields: ['accountId']
      }
    ]
  });

  promoCode.associate = function() {
  };

  return promoCode;
};