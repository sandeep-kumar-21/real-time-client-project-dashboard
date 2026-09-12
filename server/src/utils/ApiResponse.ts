export class ApiResponse<T = any> {
  public readonly success: boolean = true;
  public readonly message?: string;
  public readonly data?: T;

  constructor(data?: T, message?: string) {
    this.data = data;
    this.message = message;
  }

  static success<T>(data?: T, message?: string) {
    return new ApiResponse(data, message);
  }
}
