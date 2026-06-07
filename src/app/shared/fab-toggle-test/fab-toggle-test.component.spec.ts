import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FabToggleTestComponent } from './fab-toggle-test.component';

describe('FabToggleTestComponent', () => {
  let component: FabToggleTestComponent;
  let fixture: ComponentFixture<FabToggleTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FabToggleTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FabToggleTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
