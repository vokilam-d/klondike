import { async, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { WebAdminAppComponent } from './app.component';

describe('WebAdminAppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        WebAdminAppComponent
      ],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(WebAdminAppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'web-admin'`, () => {
    const fixture = TestBed.createComponent(WebAdminAppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('web-admin');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(WebAdminAppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.content span').textContent).toContain('web-admin app is running!');
  });
});
