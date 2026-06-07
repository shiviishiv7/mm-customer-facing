import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FabButtonDashboardComponent } from './fab-button-dashboard.component';

describe('FabButtonDashboardComponent', () => {
  let component: FabButtonDashboardComponent;
  let fixture: ComponentFixture<FabButtonDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FabButtonDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FabButtonDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
