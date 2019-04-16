import HTTPService from "./http/service";
import http from "../config/http";
import models from "./models";

import publicRoutes from "./routes/public";

const publicHttpService = new HTTPService(publicRoutes);
models.sequelize.sync({ force: !!process.env.DB_FORCE_SYNC }).then(() => {
  console.log('Sync success');
}).catch(error => {
  console.error(error);
});
publicHttpService.start(process.env.PORT || http[process.env.NODE_ENV].port);