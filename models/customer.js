/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  #_notes;
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.#_notes = notes;
  }

  /** get a customer's full name. */

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /** getter to retrieve notes value or */
  /** an empty string to a falsey notes value*/
  
  get notes(){
    if(!this.#_notes)
      return ' ';
    return this.#_notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** search for a customer by name. */

  static async search(name) {
    const results = await db.query(
      `SELECT id, 
        first_name AS "firstName",  
        last_name AS "lastName" 
       FROM customers 
       WHERE lower(first_name) 
       LIKE lower('%' || $1 || '%')
       OR lower(last_name) 
       LIKE lower('%' || $1 || '%')
       ORDER BY last_name, first_name`,
      [name]
    );
    return results.rows.map(c => new Customer(c));
  }

  /** find top 10 customers ordered by most reservations. */

  static async getTopTen() {
    const results = await db.query(
      `SELECT c.id, 
        c.first_name AS "firstName",  
        c.last_name AS "lastName", 
        COUNT(r.id) AS "count"
       FROM customers c
       JOIN reservations r
       ON c.id = r.customer_id
       GROUP BY c.id, c.first_name, c.last_name
       ORDER BY COUNT(r.id) DESC
       LIMIT 10`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }
}

module.exports = Customer;
