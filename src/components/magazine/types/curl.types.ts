// curl.types.ts

// Define the base interface for a page curl action
export interface PageCurl {
    curlDirection: 'left' | 'right';  // Direction of the page curl
    curlAmount: number;               // Amount of curl (0 to 1)
    duration: number;                 // Animation duration in milliseconds
}

// Define an interface for the page that will have the curl effect
export interface Page {
    id: string;                       // Unique identifier for the page
    content: string;                  // Content of the page
    curlState: boolean;               // Whether the page is currently curled
    curlProperties: PageCurl;         // Properties controlling the curl effect
}

// Define a type for a collection of pages in a magazine
export type Magazine = Page[]; 

// Function to initiate curl on a page
export function initiateCurl(page: Page, curlDirection: 'left' | 'right', curlAmount: number, duration: number): void {
    // Logic to initiate page curl
document.getElementById(page.id)?.classList.add(`curl-${curlDirection}`);
    page.curlState = true;
}

// Function to complete the curl action
export function completeCurl(page: Page): void {
    // Logic to complete page curl
    page.curlState = false;
}