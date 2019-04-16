'use strict';
module.exports = (sequelize, DataTypes) => {
  var channel = sequelize.define('channel', {
    guid: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    name: {
      type: DataTypes.STRING(75),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(25),
      allowNull: true
    },
    transport: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    tarif: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    notEnoughMoney: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    temporary: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
  }, {
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['accountId', 'transport', 'phone']
      }
    ]
  });

  channel.associate = function(models) {
    channel.belongsTo(models.account, {
      foreignKey: 'accountId'
    });
  };

  return channel;
};