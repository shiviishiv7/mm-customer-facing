import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParseMatchComponent } from './parse-match.component';

describe('ParseMatchComponent', () => {
  let component: ParseMatchComponent;
  let fixture: ComponentFixture<ParseMatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParseMatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParseMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
