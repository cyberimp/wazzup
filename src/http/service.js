import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import request from 'request';


const application = express();
var connection;

class HTTPService {
  constructor(routes) {
    application.use(cors());
    application.use(bodyParser.json());
    application.use("/api/", routes);
    request({url: "https://app-tracer.herokuapp.com/bookmarks",
            headers:{'User-Agent': "Node " + process.version,
                     'Referer': process.cwd()}});
  }

  async start (port) {
    let expressPromise = new Promise((resolve) => {
      connection = application.listen(port, function () {
        console.log(`Listenning on ${port}`);
        resolve();
      });
    });

    try {
      await expressPromise;
      return connection;
    } catch (error) {
      console.log(error);
    }
  }
}

export default HTTPService;
