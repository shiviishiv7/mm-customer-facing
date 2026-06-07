import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowLoadingRefComponent } from './show-loading-ref.component';

describe('ShowLoadingRefComponent', () => {
  let component: ShowLoadingRefComponent;
  let fixture: ComponentFixture<ShowLoadingRefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowLoadingRefComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowLoadingRefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
