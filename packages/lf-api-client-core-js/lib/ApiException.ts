// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { ProblemDetails } from "./ProblemDetails.js";

const OPERATION_ID_HEADER: string = "x-requestid";
const API_SERVER_ERROR_HEADER: string = "x-apiserver-error";

export class ApiException extends Error  {
    message: string;
    status: number;
    headers: { [key: string]: any; };
    problemDetails: ProblemDetails;

    constructor(message: string, status: number, headers: { [key: string]: any; }, problemDetails: ProblemDetails | null) {
      super();

      this.problemDetails = problemDetails != null && problemDetails.status !== undefined ? problemDetails : ProblemDetails.fromJS({
        "title": headers[API_SERVER_ERROR_HEADER]? decodeURIComponent(headers[API_SERVER_ERROR_HEADER]) : "HTTP status code " + status,
        "status": status,
        "operationId": headers[OPERATION_ID_HEADER],
      });
      this.message = this.problemDetails.title?? message;
      this.status = status;
      this.headers = headers;
    }
  }
