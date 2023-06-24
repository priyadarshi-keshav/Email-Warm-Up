const nodemailer = require("nodemailer");
const { decrypted } = require("../utils/helpers/crypter.helper");

const createTransporterForSMTP = async (userMailCred) => {
	const password = await decrypted(
		userMailCred.userId,
		userMailCred.password
	);
	const transporter = nodemailer.createTransport({
		host: userMailCred.smtpHost,
		port: userMailCred.smtpPort,
		secure:
			userMailCred.smtpHost === "smtp.gmail.com" ||
			userMailCred.smtpHost === "mail.smtp.yahoo.com" ||
			userMailCred.smtpHost === "smtp.office365.com"
				? false
				: true,
		auth: {
			user: userMailCred.userName,
			pass: password,
		},
	});

	return transporter;
};

const sendEmailViaSMTP = async (mailOptions, userMailCred) => {
	const transporter = await createTransporterForSMTP(userMailCred);
	let response = await transporter.sendMail({
		...mailOptions,
		date: new Date(),
	});

	return response;
};

module.exports = sendEmailViaSMTP;
