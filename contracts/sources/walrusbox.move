module walrusbox::walrusbox;

use sui::object::{UID, ID};
use sui::tx_context::TxContext;
use sui::table::Table;
use std::string::String;

/// Visibility constants
const VISIBILITY_PRIVATE: u8 = 0;
const VISIBILITY_PUBLIC: u8 = 1;

/// Error codes
const E_NOT_OWNER: u64 = 0;
const E_INVALID_VISIBILITY: u64 = 2;
const E_ADDRESS_ALREADY_ALLOWED: u64 = 3;
const E_ADDRESS_NOT_ALLOWED: u64 = 4;

/// FileObject struct stores metadata for encrypted files stored on Walrus
public struct FileObject has key, store {
    id: UID,
    /// Unique identifier for the file
    file_id: String,
    /// Walrus object hash (CID-like reference) for the encrypted file
    walrus_object_hash: vector<u8>,
    /// Owner address of the file
    owner: address,
    /// Visibility: 0 = private, 1 = public
    visibility: u8,
    /// List of addresses allowed to access this file (for private files)
    allowed_addresses: vector<address>,
    /// Timestamp when file was created
    created_at: u64,
}

/// Registry to track all FileObjects by file_id
public struct FileRegistry has key {
    id: UID,
    /// Maps file_id to FileObject ID
    files: Table<String, ID>,
}

/// Helper function to check if address exists in vector
fun contains_address(addresses: &vector<address>, addr: address): bool {
    let mut i = 0;
    let len = std::vector::length(addresses);
    while (i < len) {
        if (*std::vector::borrow(addresses, i) == addr) {
            return true
        };
        i = i + 1;
    };
    false
}

/// Helper function to remove address from vector
fun remove_address(addresses: &mut vector<address>, addr: address) {
    let mut i = 0;
    let len = std::vector::length(addresses);
    while (i < len) {
        if (*std::vector::borrow(addresses, i) == addr) {
            std::vector::remove(addresses, i);
            return
        };
        i = i + 1;
    };
}

/// Create a new FileObject and register it
public entry fun create_file(
    registry: &mut FileRegistry,
    file_id: vector<u8>,
    walrus_object_hash: vector<u8>,
    ctx: &mut TxContext
) {
    let owner = sui::tx_context::sender(ctx);
    let timestamp = sui::tx_context::epoch_timestamp_ms(ctx);
    let file_id_string = std::string::utf8(file_id);
    
    let file_object = FileObject {
        id: sui::object::new(ctx),
        file_id: file_id_string,
        walrus_object_hash,
        owner,
        visibility: VISIBILITY_PRIVATE,
        allowed_addresses: std::vector::empty(),
        created_at: timestamp,
    };
    
    let file_object_id = sui::object::id(&file_object);
    
    // Register the file
    sui::table::add(&mut registry.files, file_id_string, file_object_id);
    
    // Transfer ownership to the creator
    sui::transfer::transfer(file_object, owner);
}

/// Set visibility of a file (public or private)
public entry fun set_visibility(
    file_object: &mut FileObject,
    visibility: u8,
    ctx: &TxContext
) {
    assert!(sui::tx_context::sender(ctx) == file_object.owner, E_NOT_OWNER);
    assert!(visibility == VISIBILITY_PRIVATE || visibility == VISIBILITY_PUBLIC, E_INVALID_VISIBILITY);
    
    file_object.visibility = visibility;
}

/// Add an address to the allowed list for a private file
public entry fun add_allowed_address(
    file_object: &mut FileObject,
    allowed_address: address,
    ctx: &TxContext
) {
    assert!(sui::tx_context::sender(ctx) == file_object.owner, E_NOT_OWNER);
    assert!(!contains_address(&file_object.allowed_addresses, allowed_address), E_ADDRESS_ALREADY_ALLOWED);
    
    std::vector::push_back(&mut file_object.allowed_addresses, allowed_address);
}

/// Remove an address from the allowed list
public entry fun remove_allowed_address(
    file_object: &mut FileObject,
    allowed_address: address,
    ctx: &TxContext
) {
    assert!(sui::tx_context::sender(ctx) == file_object.owner, E_NOT_OWNER);
    assert!(contains_address(&file_object.allowed_addresses, allowed_address), E_ADDRESS_NOT_ALLOWED);
    
    remove_address(&mut file_object.allowed_addresses, allowed_address);
}

/// Verify if a requester has access to a file
public fun verify_access(
    file_object: &FileObject,
    requester_address: address
): bool {
    // Owner always has access
    if (requester_address == file_object.owner) {
        return true
    };
    
    // Public files are accessible to everyone
    if (file_object.visibility == VISIBILITY_PUBLIC) {
        return true
    };
    
    // For private files, check if requester is in allowed list
    if (file_object.visibility == VISIBILITY_PRIVATE) {
        return contains_address(&file_object.allowed_addresses, requester_address)
    };
    
    false
}

/// Get file metadata (read-only view)
public fun get_file_metadata(file_object: &FileObject): (String, vector<u8>, address, u8, u64) {
    (
        file_object.file_id,
        file_object.walrus_object_hash,
        file_object.owner,
        file_object.visibility,
        file_object.created_at
    )
}

/// Get allowed addresses for a file
public fun get_allowed_addresses(file_object: &FileObject): vector<address> {
    file_object.allowed_addresses
}

/// Get FileObject ID from registry by file_id
public fun get_file_id(registry: &FileRegistry, file_id: String): &ID {
    sui::table::borrow(&registry.files, file_id)
}

/// Initialize the FileRegistry (called once during module publish)
fun init(ctx: &mut TxContext) {
    let registry = FileRegistry {
        id: sui::object::new(ctx),
        files: sui::table::new(ctx),
    };
    
    sui::transfer::share_object(registry);
}

