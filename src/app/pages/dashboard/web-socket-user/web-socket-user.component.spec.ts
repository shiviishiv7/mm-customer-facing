import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebSocketUserComponent } from './web-socket-user.component';

describe('WebSocketUserComponent', () => {
  let component: WebSocketUserComponent;
  let fixture: ComponentFixture<WebSocketUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebSocketUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebSocketUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
