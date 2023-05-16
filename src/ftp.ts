import * as FTPS from "ftps";
import * as fs from 'fs';
import {log} from "./log";

const LOG_NAME = 'ocpp-chargepoint-simulator:simulator:ftp-support';

interface FtpParameters {
  user: string;
  password: string;
  host: string;
  localPath: string;
  remotePath: string;
  fileName: string;
}

export class FtpSupport {

  ftpsClient(host: string, username: string, password: string): FTPS {
    // TODO: this possibly breaks if the certificate is not available. Haven' tested it.
    return new FTPS({
      host: host,
      username: username,
      password: password,
      requiresPassword: false,
      additionalLftpCommands: 'set ssl:ca-file "' + process.env.SSL_CERT_FILE + '"',
    });
  }

  ftpUploadDummyFile(fileLocation: string, fileName: string): Promise<void> {
    const {user, password, host, remotePath, localPath} = this.extracted(fileLocation, false);
    fs.writeFileSync(localPath + "/" + fileName, "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.");
    return this.ftpsClient(host, user, password).put(localPath + "/" + fileName, remotePath + "/" + fileName).exec((error, result) => {
      return new Promise((resolve, reject) => {
        if (error) {
          reject()
        } else {
          resolve()
        }
      });
    });
  }

  ftpDownload(fileLocation: string): Promise<string> {
    const {user, password, host, localPath, fileName} = this.extracted(fileLocation, true);
    const client = this.ftpsClient(host, user, password);
    return client.get(fileName, localPath + "/" + fileName).exec((error, result) => {
      return new Promise((resolve, reject) => {
        if (error) {
          reject()
        } else {
          resolve(localPath + "/" + fileName)
        }
      });
    });
  }

  private extracted(fileLocation: string, withFilename: boolean): FtpParameters {
    let fileLocTmp = fileLocation.substr("ftp://".length);
    const credentials = fileLocTmp.substr(0, fileLocTmp.indexOf('@'));
    let user;
    let password;
    if (credentials.indexOf(':') > -1) {
      user = credentials.substr(0, credentials.indexOf(':'));
      password = credentials.substr(credentials.indexOf(':') + 1);
    } else {
      user = credentials;
      password = ''
    }
    fileLocTmp = fileLocTmp.substr(fileLocTmp.indexOf('@') + 1);
    let fileName = '';
    let remotePath = '';
    let host;
    if (fileLocTmp.indexOf('/') > -1) {
      host = fileLocTmp.substr(0, fileLocTmp.indexOf('/'));
      fileLocTmp = fileLocTmp.substr(fileLocTmp.indexOf('/') + 1);
      if (withFilename) {
        if (fileLocTmp.indexOf('/') > -1) {
          remotePath = fileLocTmp.substr(0, fileLocTmp.lastIndexOf('/'));
          fileLocTmp = fileLocTmp.substr(fileLocTmp.lastIndexOf('/') + 1);
          fileName = fileLocTmp;
        } else {
          fileName = fileLocTmp;
        }
      } else {
        remotePath = fileLocTmp;
      }
    } else {
      host = fileLocTmp;
    }
    const localPath = fs.mkdtempSync('ocpp-simulator') + '/' + remotePath;
    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath, {recursive: true});
    }
    log.debug(LOG_NAME, '-', `ftp credentials: user=${user}, password.length=${password.length}, host=${host}, fileName=${fileName}, remotePath=${remotePath}, localPath=${localPath}`);
    return {user, password, host, localPath, fileName, remotePath};
  }

}
