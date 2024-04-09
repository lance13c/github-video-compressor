interface PrepareImageResponse {
  upload_url: string;
  asset_upload_url: string;
  asset_upload_authenticity_token: string;
  form: {
    [key: string]: string;
  };
}

interface ImageStartResponse {
  content_type: string;
  href: string;
  id: number;
  name: string;
  original_name: string | null;
  size: number;
}

export class GithubUploader {
  private baseUrl: string = 'https://github.com';
  private prepare_route: string = '/upload/policies/assets';

  constructor() {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async request(url: string, method: string = 'GET', formData: FormData, headers?: HeadersInit): Promise<any> {
    const response = await fetch(url, {
      method: method,
      headers: headers,
      body: formData,
      credentials: 'include',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return response.json();
  }

  public async startImageUpload({
    imageName,
    imageSize,
    authenticity_token,
    repository_id,
    content_type,
    file,
  }: {
    imageName: string;
    imageSize: number;
    authenticity_token: string;
    repository_id: string;
    content_type: string;
    file: File;
  }): Promise<[Promise<ImageStartResponse>, Promise<Response>]> {
    const formData = new FormData();
    formData.append('name', imageName);
    formData.append('size', `${imageSize}`);
    formData.append('authenticity_token', authenticity_token);
    formData.append('repository_id', repository_id);
    formData.append('content_type', content_type);

    const prepareResponse: PrepareImageResponse = await this.request(
      this.baseUrl + this.prepare_route,
      'POST',
      formData,
      {
        // Do not set the content-type header, the browser will set it
        Accept: 'application/json',
      },
    );

    // Do this asynchronously
    const imageUploadResponse = this.uploadImageToS3(file, prepareResponse);

    const putAssetFormData = new FormData();
    putAssetFormData.append('authenticity_token', prepareResponse.asset_upload_authenticity_token);

    // Puts the image info into github assets, gets back the asset url.
    return [this.request(this.baseUrl + prepareResponse.asset_upload_url, 'PUT', putAssetFormData, {
      Accept: 'application/json',
    }), imageUploadResponse];
  }

  private async uploadImageToS3(file: File, uploadData: PrepareImageResponse): Promise<Response> {
    const formData = new FormData();

    // Add form fields from uploadData
    Object.entries(uploadData.form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Append the file
    formData.append('file', file);

    const imageRes = await fetch(uploadData.upload_url, {
      method: 'POST',
      body: formData,
      // Note: Do not set Content-Type header here, browser will set it.
    });

    if (imageRes.status !== 204) {
      throw new Error('Image S3 upload failed');
    }

    return imageRes;
  }
}
