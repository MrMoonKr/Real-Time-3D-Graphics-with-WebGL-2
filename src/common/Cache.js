


const Cache =
{
    enabled: false,

    files: {},

    add: function( key, file )
    {
        if ( this.enabled === false ) return ;
        
        this.files[ key ] = file ;
    },
    
    get: function( key )
    {
        if ( this.enabled === false ) return ;
        
        return this.files[ key ] ;
    },
    
    remove: function( key )
    {
        if ( this.enabled === false ) return ;

        delete this.files[ key ] ;
    },

    clear: function() {

        this.files = {} ;
    }
}


export default Cache ;
