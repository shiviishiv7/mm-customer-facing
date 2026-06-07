import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Amplify } from 'aws-amplify';
import { saveAs } from 'file-saver';
import { Observable, Subscriber } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class FileOperationsService {

  selectedFile: File = null;

  constructor(private http: HttpClient) {}

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    this.selectedFile = file;
  }

  onUpload(data, name): Observable<Object> {
    // below line is json data
    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: 'application/json' });
  
      const formData = new FormData();
      formData.append('file', blob, name);
      
       return   this.http.post<Object>('your-api-endpoint', formData);
    }
 
    downloadFile(key: string){

      // const getUrlResult = await getUrl({
      //   path: 'public/album/2024/1.jpg',
      //   // Alternatively, path: ({identityId}) => `protected/${identityId}/album/2024/1.jpg`
      //   options: {
      //     validateObjectExistence?: false,  // Check if object exists before creating a URL
      //     expiresIn?: 20 // validity of the URL, in seconds. defaults to 900 (15 minutes) and maxes at 3600 (1 hour)
      //     useAccelerateEndpoint?: true; // Whether to use accelerate endpoint
      //   },
      // });
      // console.log('signed URL: ', getUrlResult.url);
      // console.log('URL expires at: ', getUrlResult.expiresAt);
    }
    
}
