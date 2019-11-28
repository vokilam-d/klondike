import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MediaDto } from '../../../../backend/src/shared/dtos/admin/media.dto';

@Component({
  selector: 'web-admin-media-asset',
  templateUrl: './web-admin-media-asset.component.html',
  styleUrls: ['./web-admin-media-asset.component.scss']
})
export class WebAdminMediaAssetComponent implements OnInit {

  @Input() media: MediaDto;
  @Output('remove') removeEmitter = new EventEmitter<MediaDto>();

  constructor() { }

  ngOnInit() {
  }

  remove() {
    this.removeEmitter.emit(this.media);
  }
}
