/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");


/** A reservation for a party */

class Reservation {
  constructor({id, customerId, numGuests, startAt, notes}) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** get and set number of guests */

  get numGuests(){ return this._numGuests; }
  set numGuests(val){ 
    if (val < 1) {
      const err = new Error(`Invalid data: reservation value must be 1 or greater`);
      err.status = 422;
      throw err;
    }
    this._numGuests = val;
  }

  /** get and set start date */

  get startAt(){ return this._startAt; }
  set startAt(val){ 
    // https://stackoverflow.com/questions/50945994/whats-the-best-way-of-checking-that-a-value-is-a-timestamp
    let isDate = Number(val) ? new Date(Number(val)).getTime() > 0 : false;
    if (!isDate) {
      const err = new Error(`Invalid data: start value must be a valid date and time`);
      err.status = 422;
      throw err;
    }
    this._startAt = val;
  }

  /** get and set customer id */

  get customerId(){ return this._customerId; }
  set customerId(val){ 
    if(this.customerId === undefined)
      this._customerId = val;
    else{
      const err = new Error(`Customer id cannot be assigned to a new value`);
      err.status = 422;
      throw err;
    }
  }

  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
        [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

  /** save this reservation. */

  async save() {
    const result = await db.query(
      `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
          VALUES ($1, $2, $3, $4)
          RETURNING id`,
      [this.customerId, this.numGuests, this.startAt, this.notes]
    );
    this.id = result.rows[0].id;
  } 
}


module.exports = Reservation;
