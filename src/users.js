'use strict';

var sqlite = require('sqlite3').verbose();

var db = new sqlite.Database(
	`${ROOT_DIR}/db/bot.sqlite`,
	sqlite.OPEN_READWRITE,
	function() {
		console.log('DB', arguments);
	}
);

class UsersError extends Error {}

/**
 * Класс для работы с пользователями в бд.
 * @class User
 */
class User {
	/**
	 * Вставка пользователя в бд.
	 * @param id
	 * @param name
	 * @returns {Promise}
	 * @private
	 */
	_insert(id, name) {
		let self = this;

		return new Promise((resolve, reject) => {
			db.serialize(() => {
				db.run('insert into users (t_id, name) values ($id, $name)',
					{
						$id: id,
						$name: name
					},
					function (error) {
						console.trace(error);
						if (error) {
							reject(error);
						} else {
							self.get(this.changes.t_id)
								.then(user => resolve(user));
						}
					});
			});
		});
	}

	/**
	 * Регистрация пользователя
	 * @param {number}	id		id пользователя в телеграфе
	 * @param {string	}name	имя, которое выбирает пользователь
	 * @returns {Promise.<TResult>}
	 */
	reg(id, name) {
		return this.get(id)
			.then((user) => {
				if (user) {
					throw new UsersError('Такой пользователь уже существует');
				} else {
					return this._insert(id, name);
				}
			})
	}

	/**
	 * Получение зарегистрированного пользователя.
	 * @param id
	 * @returns {Promise}
	 */
	get(id) {
		return new Promise((resolve, reject) => {
				db.serialize(() => {
					db.get('select * from users where t_id = $id',
						{$id: id},
						(error, user) => {
							if (error) {
								reject(error);
							} else {
								resolve(user);
							}
						}
					);
				});
			});
	}
}

module.exports = new User();
