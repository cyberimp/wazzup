'use strict';
module.exports = (sequelize, DataTypes) => {
  var notification = sequelize.define('notification', {
    guid: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    template: {
      allowNull: false,
      type: DataTypes.STRING(50)
    },
    lang: {
      allowNull: false,
      type: DataTypes.STRING(2)
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      allowNull: false,
      type: DataTypes.UUID
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    shownAt: {
      type: DataTypes.DATE
    },
    shown: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    title: {
      allowNull: false,
      type: DataTypes.STRING(200)
    },
    content: {
      allowNull: false,
      type: DataTypes.TEXT
    }
  }, {
    timestamps: false
  });

  notification.associate = function(models) {
    notification.belongsTo(models.account, {
      foreignKey: 'accountId'
    });

    notification.belongsTo(models.user, {
      foreignKey: 'userId'
    });

    notification.belongsTo(models.notifyTemplate, {
      foreignKey: 'template',
      otherKey: 'lang'
    });
  };

  return notification;
};