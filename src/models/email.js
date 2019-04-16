'use strict';
module.exports = (sequelize, DataTypes) => {
  var email = sequelize.define('email', {
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
    email: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    sentAt: {
      type: DataTypes.DATE
    },
    sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    readAt: {
      type: DataTypes.DATE
    },
    title: {
      allowNull: false,
      type: DataTypes.STRING(200)
    },
    html: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    errors: {
      allowNull: false,
      type: DataTypes.TEXT
    }
  }, {
    timestamps: false
  });

  email.associate = function(models) {
    email.belongsTo(models.account, {
      foreignKey: 'accountId'
    });

    email.belongsTo(models.user, {
      foreignKey: 'userId'
    });

    email.belongsTo(models.notifyTemplate, {
      foreignKey: 'template',
      otherKey: 'lang'
    });
  };

  return email;
};