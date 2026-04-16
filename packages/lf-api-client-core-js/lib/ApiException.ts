// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { ProblemDetails } from "./ProblemDetails.js";

const OPERATION_ID_HEADER: string = "x-requestid";
const API_SERVER_ERROR_HEADER: string = "x-apiserver-error";

export class ApiException extends Error {
  message: string;
  status: number;
  headers: Record<string, unknown>;
  problemDetails: ProblemDetails;

  constructor(message: string, status: number, headers: Record<string, unknown> | Headers, problemDetails: ProblemDetails | null) {
    super();
    // Convert Headers to plain object if needed
    const headersObj: Record<string, unknown> = headers instanceof Headers
      ? Object.fromEntries(headers.entries())
      : headers;

    this.problemDetails = problemDetails != null && problemDetails.status !== undefined ? problemDetails : ProblemDetails.fromJS({
      "title": headersObj[API_SERVER_ERROR_HEADER] ? decodeURIComponent(headersObj[API_SERVER_ERROR_HEADER] as string) : "HTTP status code " + status,
      "status": status,
      "operationId": headersObj[OPERATION_ID_HEADER],
    });
    this.message = this.problemDetails.title ?? message;
    this.status = status;
    this.headers = headersObj;
  }
}
