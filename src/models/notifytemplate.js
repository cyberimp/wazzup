'use strict';
module.exports = (sequelize, DataTypes) => {
  var notifyTemplate = sequelize.define('notifyTemplate', {
    code: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING(50)
    },
    lang: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING(2)
    },
    emailTitle: {
      type: DataTypes.STRING(200)
    },
    interfaceTitle: {
      type: DataTypes.STRING(200)
    },
    emailHtml: {
      type: DataTypes.TEXT
    },
    interfaceContent: {
      type: DataTypes.TEXT
    }
  }, {
    timestamps: false
  });

  return notifyTemplate;
};