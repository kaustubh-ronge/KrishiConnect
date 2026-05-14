// export const getFilteredItems = ({
//     activeView, pendingProfiles, farmers, agents, deliveryPartners,
//     orders, products, deliveryJobs, reviews, supportMessages, specialRequests,
//     statusFilter, search
// }) => {
//     let items = [];
//     if (activeView === 'verifications') items = Array.isArray(pendingProfiles) ? pendingProfiles : [];
//     else if (activeView === 'farmers') items = Array.isArray(farmers) ? farmers : [];
//     else if (activeView === 'agents') items = Array.isArray(agents) ? agents : [];
//     else if (activeView === 'delivery') items = Array.isArray(deliveryPartners) ? deliveryPartners : [];
//     else if (activeView === 'orders') items = Array.isArray(orders) ? orders : [];
//     else if (activeView === 'disputes') items = Array.isArray(orders) ? orders.filter(o => o.disputeStatus === 'OPEN') : [];
//     else if (activeView === 'catalog') items = Array.isArray(products) ? products : [];
//     else if (activeView === 'logistics') items = Array.isArray(deliveryJobs) ? deliveryJobs : [];
//     else if (activeView === 'reviews') items = Array.isArray(reviews) ? reviews : [];
//     else if (activeView === 'support') items = Array.isArray(supportMessages) ? supportMessages : [];
//     else if (activeView === 'mediation') items = Array.isArray(specialRequests) ? specialRequests : [];

//     if (statusFilter && statusFilter !== 'ALL') {
//         items = items.filter(item => {
//             const status = (item.status || item.orderStatus || item.payoutStatus || item.paymentStatus || item.approvalStatus || item.sellingStatus || (item.isRead ? 'CLOSED' : 'OPEN'))?.toUpperCase();
//             return status === statusFilter.toUpperCase();
//         });
//     }

//     if (search) {
//         const s = search.toLowerCase();
//         items = items.filter(item =>
//             (item.name || item.displayName || item.buyerName || item.userName || item.productName || item.product?.productName || item.user?.name || "")
//                 .toLowerCase().includes(s)
//         );
//     }

//     return items;
// };

// export const getStatusOptions = (activeView) => {
//     const options = {
//         support: [
//             { label: 'Open', value: 'OPEN' },
//             { label: 'Closed', value: 'CLOSED' },
//         ],
//         orders: [
//             { label: 'Pending', value: 'PENDING' },
//             { label: 'Processing', value: 'PROCESSING' },
//             { label: 'Shipped', value: 'SHIPPED' },
//             { label: 'Delivered', value: 'DELIVERED' },
//             { label: 'Cancelled', value: 'CANCELLED' },
//         ],
//         payouts: [
//             { label: 'Pending', value: 'PENDING' },
//             { label: 'Settled', value: 'SETTLED' },
//         ],
//         mediation: [
//             { label: 'Pending', value: 'PENDING' },
//             { label: 'Approved', value: 'APPROVED' },
//             { label: 'Rejected', value: 'REJECTED' },
//         ],
//     };
//     return options[activeView] || [];
// };

// export const paginate = (items) => items;