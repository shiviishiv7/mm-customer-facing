import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSettingProfileComponent } from './show-setting-profile.component';

describe('ShowSettingProfileComponent', () => {
  let component: ShowSettingProfileComponent;
  let fixture: ComponentFixture<ShowSettingProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShowSettingProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowSettingProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
