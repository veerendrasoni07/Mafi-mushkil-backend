"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportController = exports.FAQ_ITEMS = exports.SUPPORT_INFO = void 0;
const response_1 = require("../../shared/utils/response");
exports.SUPPORT_INFO = {
    phone: '+919876543210',
    formattedPhone: '+91 98765 43210',
    whatsapp: '+919876543210',
    formattedWhatsapp: '+91 98765 43210',
    email: 'support@mafimushkil.example',
    workingHours: 'Mon-Sat, 9am - 7pm',
};
exports.FAQ_ITEMS = [
    {
        id: 'faq_1',
        question: 'How do I book a service?',
        answer: 'Open Home, tap a service, choose a category and product, then tap Book.',
        defaultExpanded: true,
    },
    {
        id: 'faq_2',
        question: 'How do I track my engineer?',
        answer: 'Go to Orders tab or Customer Dashboard to see your assigned engineer name and live status.',
        defaultExpanded: false,
    },
    {
        id: 'faq_3',
        question: 'How do I raise a complaint?',
        answer: 'Open the hamburger menu, tap Complain, pick your order from the dropdown, describe what went wrong, and submit.',
        defaultExpanded: false,
    },
    {
        id: 'faq_4',
        question: 'Can I cancel a request?',
        answer: 'You can cancel a request before an engineer is dispatched by contacting our support team via Call or WhatsApp.',
        defaultExpanded: false,
    },
];
class SupportController {
    static getSupportInfo(_req, res) {
        (0, response_1.sendSuccess)(res, exports.SUPPORT_INFO);
    }
    static getFaqs(_req, res) {
        (0, response_1.sendSuccess)(res, exports.FAQ_ITEMS);
    }
}
exports.SupportController = SupportController;
