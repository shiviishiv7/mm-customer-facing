import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PyqHomeButtonComponent } from './pyq-home-button.component';

describe('PyqHomeButtonComponent', () => {
  let component: PyqHomeButtonComponent;
  let fixture: ComponentFixture<PyqHomeButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PyqHomeButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PyqHomeButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
