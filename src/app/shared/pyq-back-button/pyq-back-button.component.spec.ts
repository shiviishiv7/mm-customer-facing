import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PyqBackButtonComponent } from './pyq-back-button.component';

describe('PyqBackButtonComponent', () => {
  let component: PyqBackButtonComponent;
  let fixture: ComponentFixture<PyqBackButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PyqBackButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PyqBackButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
