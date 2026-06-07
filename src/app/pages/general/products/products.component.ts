import { Component } from '@angular/core';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent {

  products: any[] = [];

  constructor() {}

  ngOnInit() {
    this.products = this.getProducts();
  }
  getProducts() {
    return [
      { id: 1, name: 'Product 1', price: 100, description: 'Description for Product 1' },
      { id: 2, name: 'Product 2', price: 200, description: 'Description for Product 2' },
      { id: 3, name: 'Product 3', price: 300, description: 'Description for Product 3' },
    ];
  }
}
