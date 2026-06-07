import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstantMatchComponent } from './instant-match.component';

describe('InstantMatchComponent', () => {
  let component: InstantMatchComponent;
  let fixture: ComponentFixture<InstantMatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstantMatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstantMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
