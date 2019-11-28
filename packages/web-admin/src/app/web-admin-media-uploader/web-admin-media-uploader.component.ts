import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { MediaDto } from '../../../../backend/src/shared/dtos/admin/media.dto';

@Component({
  selector: 'web-admin-media-uploader',
  templateUrl: './web-admin-media-uploader.component.html',
  styleUrls: ['./web-admin-media-uploader.component.scss']
})
export class WebAdminMediaUploaderComponent implements OnInit {

  @Input() uploadUrl: string;
  @Output('uploaded') uploadedEmitter = new EventEmitter<MediaDto>();
  @ViewChild('input') inputRef: ElementRef<HTMLInputElement>;

  constructor(private http: HttpClient) {
  }

  ngOnInit() {
  }

  onInputChange(files: FileList) {
    const file = files.item(0);

    this.uploadFile(file);
  }

  private uploadFile(file: File) {
    const payload = new FormData();
    payload.append('file', file, file.name);

    this.http.post<MediaDto>(this.uploadUrl, payload)
      .pipe( finalize(() => this.inputRef.nativeElement.value = '') )
      .subscribe(
        media => {
          this.uploadedEmitter.emit(media);
        },
        error => console.warn(error)
      );
  }
}
