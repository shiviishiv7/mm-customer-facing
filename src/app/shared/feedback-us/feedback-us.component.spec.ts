import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackUsComponent } from './feedback-us.component';

describe('FeedbackUsComponent', () => {
  let component: FeedbackUsComponent;
  let fixture: ComponentFixture<FeedbackUsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeedbackUsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeedbackUsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
